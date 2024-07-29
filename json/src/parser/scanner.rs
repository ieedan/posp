use super::{
    error::Error,
    tokens::{keywords, Literal, Token, TokenType},
    utils::{is_alpha, is_digit},
    Options,
};

pub struct Scanner {
    source: String,
    tokens: Vec<Token>,
    current: usize,
    line: usize,
    column: usize,
    start: usize,
    options: Options,
}

impl Scanner {
    pub fn new(source: String, options: Options) -> Self {
        Self {
            source,
            current: 0,
            line: 1,
            column: 1,
            start: 0,
            tokens: vec![],
            options
        }
    }

    pub fn scan(&mut self) -> Result<Vec<Token>, Error> {
        let keywords = keywords();

        while !self.is_at_end() {
            self.start = self.current;

            let c = self.source.as_bytes()[self.current];

            match c {
                b'{' => self.add_token(TokenType::LeftBrace),
                b'}' => self.add_token(TokenType::RightBrace),
                b':' => self.add_token(TokenType::Colon),
                b',' => self.add_token(TokenType::Comma),
                b'[' => self.add_token(TokenType::LeftSquareBracket),
                b']' => self.add_token(TokenType::RightSquareBracket),
                b'"' => {
                    let start_line = self.line;
                    let start_column = self.column;
                    self.advance();

                    let literal = self.consume(
                        b'"',
                        format!("{}:{} Unclosed '\"'", start_line, start_column),
                    )?;

                    self.tokens.push(Token {
                        typ: TokenType::String,
                        column: start_column,
                        line: start_line,
                        lexeme: self.source[self.start - 1..self.current].to_string(),
                        literal: Some(Literal::String(literal)),
                    });
                }
                b'\n' => self.new_line(),
                // skip whitespace
                b' ' | b'\r' | b'\t' => {
                    self.advance();
                }
                _ => {
                    if is_digit(&c) {
                        let start_line = self.line;
                        let start_column = self.column;

                        while is_digit(&self.peek()) {
                            self.advance();
                        }

                        if self.peek() == b'.' && is_digit(&self.peek_next()) {
                            self.advance();

                            while is_digit(&self.peek()) {
                                self.advance();
                            }

                            self.advance();

                            let literal = &self.source[self.start..self.current - 1];

                            let number: f64 = literal.parse().unwrap();

                            self.tokens.push(Token {
                                typ: TokenType::Number,
                                column: start_column,
                                line: start_line,
                                literal: Some(Literal::Number(number)),
                                lexeme: literal.to_string(),
                            });
                        }
                    } else if is_alpha(&c) {
                        while is_alpha(&self.peek()) {
                            self.advance();
                        }

                        self.advance();

                        let identifier = &self.source[self.start..self.current - 1];

                        if let Some(keyword) = keywords.get(identifier) {
                            // add keyword
                        } else {
                            if self.options.allow_unquoted_identifier {
                                // allow option
                            } else {
                                // error
                            }
                        }
                    }

                    return Err(Error::SyntaxError(format!(
                        "Unexpected token '{}' at {}:{}.",
                        c, self.line, self.column
                    )));
                }
            }
        }

        self.add_token(TokenType::EOF);

        Ok(self.tokens.clone())
    }

    fn add_token(&mut self, typ: TokenType) {
        self.tokens.push(Token {
            column: self.column,
            line: self.line,
            lexeme: self.source.as_bytes()[self.current].to_string(),
            literal: None,
            typ,
        });

        self.advance();
    }

    fn advance(&mut self) -> u8 {
        self.current = self.current + 1;
        self.column = self.column + 1;

        self.source.as_bytes()[self.current - 1]
    }

    fn new_line(&mut self) {
        self.line = self.line + 1;
        self.column = 0;

        self.advance();
    }

    fn consume(&mut self, char: u8, msg: String) -> Result<String, Error> {
        while self.peek() != char && !self.is_at_end() {
            self.advance();
        }

        if self.is_at_end() {
            return Err(Error::SyntaxError(msg));
        }

        let result = self.source[self.start..self.current].to_string();

        // go past char
        self.advance();

        Ok(result)
    }

    fn peek(&self) -> u8 {
        self.source.as_bytes()[self.current]
    }

    fn peek_next(&self) -> u8 {
        if self.is_at_end() {
            return b'\0';
        }

        self.source.as_bytes()[self.current + 1]
    }

    fn is_at_end(&self) -> bool {
        self.current >= self.source.len()
    }
}
