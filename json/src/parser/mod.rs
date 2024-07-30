use std::collections::HashMap;

use error::Error;
use scanner::Scanner;
use tokens::{Literal, Token, TokenType};

pub mod scanner;

pub mod tokens;

pub mod error;

pub mod utils;

#[derive(Debug, Clone)]
pub struct Options {
    /// Allows keys to not be quoted such as in JavaScript
    ///
    /// # Example
    /// ```json
    /// {
    ///   foo: "bar"
    /// }
    /// ```
    pub allow_unquoted_identifier: bool,
    /// Allows trailing commas such as in JavaScript
    ///
    /// # Example
    /// ```json
    /// {
    ///   "foo": "bar",
    /// }
    /// ```
    pub allow_trailing_comma: bool,
    /// Allows single quote strings as in JavaScript.
    ///
    /// # Example
    /// ```json
    /// {
    ///    'foo': 'bar',
    /// }
    /// ```
    pub allow_single_quotes: bool,
    /// Allows comments such as in JavaScript
    ///
    /// # Example
    /// ```json
    /// {
    ///   // foo bar
    ///   "foo": "bar"
    /// }
    /// ```
    ///
    /// ```json
    /// {
    ///   /* foo bar */
    ///   "foo": "bar"
    /// }
    /// ```
    pub allow_comments: bool,
    /// If the JSON is formatted sets the width of the tab.
    /// This can be helpful to keep error messages in sync with the correct column.
    ///
    /// # Example
    /// ```json
    /// {
    /// // 4
    /// ----"foo": "bar"
    /// }
    /// ```
    ///
    /// ```json
    /// {
    /// // 2
    /// --"foo": "bar"
    /// }
    /// ```
    pub tab_width: usize,
}

impl Options {
    pub fn new(
        allow_unquoted_identifier: bool,
        allow_trailing_comma: bool,
        allow_single_quotes: bool,
        allow_comments: bool,
        tab_width: usize,
    ) -> Self {
        Self {
            allow_unquoted_identifier,
            allow_single_quotes,
            allow_trailing_comma,
            allow_comments,
            tab_width,
        }
    }

    /// Default strict options for parsing JSON
    ///
    /// ```
    /// {
    ///   allow_unquoted_identifier: false,
    ///   allow_single_quotes: false,
    ///   allow_trailing_comma: false,
    ///   allow_comments: false,
    ///   tab_width: 4,
    /// }
    /// ```
    pub fn default() -> Self {
        Self {
            allow_unquoted_identifier: false,
            allow_single_quotes: false,
            allow_trailing_comma: false,
            allow_comments: false,
            tab_width: 4,
        }
    }

    /// JavaScript style loose parsing for JSON
    ///
    /// ```
    /// {
    ///   allow_unquoted_identifier: true,
    ///   allow_single_quotes: true,
    ///   allow_trailing_comma: true,
    ///   allow_comments: true,
    ///   tab_width: 4,
    /// }
    /// ```
    pub fn js() -> Self {
        Self {
            allow_unquoted_identifier: true,
            allow_single_quotes: true,
            allow_trailing_comma: true,
            allow_comments: true,
            tab_width: 4,
        }
    }
}

#[derive(Debug, Clone)]
pub enum Value {
    Object(HashMap<String, Box<Value>>),
    Array(Vec<Box<Value>>),
    Literal(Literal),
}

#[derive(Debug, Clone)]
pub struct Parser {
    pub source: String,
    pub tokens: Vec<Token>,
    pub options: Options,
    pub current: usize,
}

impl Parser {
    pub fn new(options: Options) -> Self {
        Self {
            source: String::new(),
            tokens: vec![],
            options,
            current: 0,
        }
    }

    pub fn parse(&mut self, source: String) -> Result<Value, Error> {
        self.source = source;

        let mut scanner = Scanner::new(&self.options);

        self.tokens = scanner.scan(self.source.clone())?;

        self.value()
    }

    fn value(&mut self) -> Result<Value, Error> {
        if self.mat(vec![TokenType::LeftBrace]) {
            return self.object();
        }

        if self.mat(vec![TokenType::LeftSquareBracket]) {
            return self.array();
        }

        Ok(Value::Literal(self.literal()?))
    }

    fn array(&mut self) -> Result<Value, Error> {
        let mut values: Vec<Box<Value>> = vec![];

        let mut had_comma = false;

        while !self.check(TokenType::RightSquareBracket) && !self.is_at_end() {
            if values.len() > 0 && !had_comma {
                return Err(Error::SyntaxError(
                    "Expected ',' before next value in array.".to_string(),
                ));
            }

            had_comma = false;

            let value = self.value()?;

            values.push(Box::new(value));

            if self.check(TokenType::Comma) {
                had_comma = true;
                self.consume(
                    TokenType::Comma,
                    "Expected ',' before next value in array.".to_string(),
                )?;
            }
        }

        if had_comma {
            if self.options.allow_trailing_comma {
                // do nothing it has already been consumed
            } else {
                return Err(Error::SyntaxError(
                    "Trailing commas are not allowed.".to_string(),
                ));
            }
        }

        self.consume(
            TokenType::RightSquareBracket,
            "Expected ']' at the end of an array.".to_string(),
        )?;

        Ok(Value::Array(values))
    }

    fn object(&mut self) -> Result<Value, Error> {
        let mut properties: HashMap<String, Box<Value>> = HashMap::new();

        let mut had_comma = false;

        while !self.check(TokenType::RightBrace) && !self.is_at_end() {
            if properties.len() > 0 && !had_comma {
                let last_token = self.previous();
                return Err(Error::SyntaxError(format!(
                    "{}:{}: Expected ',' before next property in object.",
                    last_token.line, last_token.column
                )));
            }

            had_comma = false;

            let property = self.property()?;

            if properties.contains_key(&property.0) {
                return Err(Error::SyntaxError(format!(
                    "Duplicate key {} found in object.",
                    property.0
                )));
            }

            properties.insert(property.0, Box::new(property.1));

            if self.check(TokenType::Comma) {
                had_comma = true;
                self.consume(
                    TokenType::Comma,
                    "Expected ',' before next property in object.".to_string(),
                )?;
            }
        }

        if had_comma {
            if self.options.allow_trailing_comma {
                // do nothing its already been consumed
            } else {
                return Err(Error::SyntaxError(
                    "Trailing commas are not allowed.".to_string(),
                ));
            }
        }

        self.consume(
            TokenType::RightBrace,
            "Expected '}' at the end of an object.".to_string(),
        )?;

        Ok(Value::Object(properties))
    }

    fn property(&mut self) -> Result<(String, Value), Error> {
        let identifier = self.identifier()?;

        self.consume(
            TokenType::Colon,
            "Expected ':' after identifier.".to_string(),
        )?;

        let value = self.value()?;

        Ok((identifier, value))
    }

    fn identifier(&mut self) -> Result<String, Error> {
        // this will not make it past the scanner if not configured to take identifiers
        if self.mat(vec![TokenType::Identifier]) {
            return Ok(self.previous().lexeme);
        }

        if self.mat(vec![TokenType::String]) {
            match self.previous().literal.unwrap() {
                Literal::String(str) => return Ok(str),
                _ => {}
            }
        }

        Err(Error::SyntaxError(
            "Expected key for key value pair.".to_string(),
        ))
    }

    fn literal(&mut self) -> Result<Literal, Error> {
        if self.check(TokenType::Null) {
            self.advance();
            return Ok(Literal::Null);
        }

        if self.check(TokenType::True) {
            self.advance();
            return Ok(Literal::True);
        }

        if self.check(TokenType::False) {
            self.advance();
            return Ok(Literal::False);
        }

        if self.check(TokenType::String) {
            match self.peek().literal.unwrap() {
                Literal::String(str) => {
                    self.advance();
                    return Ok(Literal::String(str));
                }
                _ => {}
            }
        }

        if self.check(TokenType::Number) {
            match self.peek().literal.unwrap() {
                Literal::Number(num) => {
                    self.advance();
                    return Ok(Literal::Number(num));
                }
                _ => {}
            }
        }

        Err(Error::SyntaxError("Expected value.".to_string()))
    }

    fn mat(&mut self, types: Vec<TokenType>) -> bool {
        for typ in types {
            if self.check(typ) {
                self.advance();
                return true;
            }
        }

        return false;
    }

    fn check(&self, typ: TokenType) -> bool {
        if self.is_at_end() {
            return false;
        }

        self.peek().typ == typ
    }

    fn peek(&self) -> Token {
        // this should be safe as long as it is checked before
        self.tokens.get(self.current).unwrap().to_owned()
    }

    fn previous(&self) -> Token {
        // this should be safe as long as it is checked before
        self.tokens.get(self.current - 1).unwrap().to_owned()
    }

    fn is_at_end(&self) -> bool {
        self.peek().typ == TokenType::Eof
    }

    fn advance(&mut self) -> Token {
        self.current = self.current + 1;

        self.previous()
    }

    fn consume(&mut self, typ: TokenType, msg: String) -> Result<Token, Error> {
        if self.check(typ) {
            return Ok(self.advance());
        }

        Err(Error::SyntaxError(msg))
    }
}
