use super::{
    error::Error,
    tokens::{keywords, Literal, Token, TokenType},
    utils::{is_alpha, is_alphanumeric, is_digit},
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
            options,
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
                b'/' => {
                    if self.options.allow_comments {
                        if self.peek_next() == b'/' {
                            self.advance(1);

                            if self.peek() == b'/' {
                                self.advance(1);
                            } else {
                                continue;
                            }

                            while self.peek() != b'\n' && !self.is_at_end() {
                                self.advance(1);
                            }
                        } else if self.peek_next() == b'*' {
                            let start_line = self.line;
                            let start_column = self.column;

                            // stack allows for possibly nested comments
                            let mut stack = 1;

                            self.advance(1);
                            self.advance(1);

                            while !self.is_at_end() {
                                // check for terminating comment
                                if self.peek() == b'*' && self.peek_next() == b'/' {
                                    stack = stack - 1;

                                    self.advance(1);
                                    self.advance(1);

                                    if stack > 0 {
                                        continue;
                                    } else {
                                        break;
                                    }
                                }

                                if self.peek() == b'\n' {
                                    // handle new line
                                    self.new_line();
                                }

                                // adds a new nested comment to the stack
                                if self.peek() == b'/' && self.peek_next() == b'*' {
                                    stack = stack + 1;
                                }

                                self.advance(1);
                            }

                            if self.is_at_end() && stack > 0 {
                                return Err(Error::SyntaxError(format!(
                                    "{}:{}: Unterminated comment.",
                                    start_line, start_column
                                )));
                            }
                        }
                    } else {
                        return Err(Error::SyntaxError(format!(
                            "Unexpected token '{}' at {}:{}.",
                            *&c as char, self.line, self.column
                        )));
                    }
                }
                b'"' => {
                    let start_line = self.line;
                    let start_column = self.column;
                    self.advance(1);

                    // handles escaped '"'
                    while !(self.peek() == b'"' && self.peek_last() != b'\'') && !self.is_at_end() {
                        self.advance(1);
                    }

                    if self.is_at_end() {
                        return Err(Error::SyntaxError(format!(
                            "{}:{} Unclosed '\"'",
                            start_line, start_column
                        )));
                    }

                    let result = self.source[self.start + 1..self.current].to_string();

                    // go past char
                    self.advance(1);

                    self.tokens.push(Token {
                        typ: TokenType::String,
                        column: start_column,
                        line: start_line,
                        lexeme: self.source[self.start..self.current].to_string(),
                        literal: Some(Literal::String(result)),
                    });
                }
                b'\n' => self.new_line(),
                // skip whitespace
                b' ' | b'\r' | b'\t' => {
                    if c == b'\t' {
                        self.advance(self.options.tab_width);
                    } else {
                        self.advance(1);
                    }
                }
                _ => {
                    let start_line = self.line;
                    let start_column = self.column;
                    if is_digit(&c) || c == b'-' {
                        while is_digit(&self.peek()) || self.peek() == b'-' {
                            self.advance(1);
                        }

                        if self.peek() == b'.' && is_digit(&self.peek_next()) {
                            self.advance(1);

                            while is_digit(&self.peek()) {
                                self.advance(1);
                            }
                        }

                        if self.peek() == b'e' || self.peek() == b'E' {
                            self.advance(1);
                            if self.peek() == b'+' || self.peek() == b'-' {
                                self.advance(1);
                            }

                            while is_digit(&self.peek()) {
                                self.advance(1);
                            }
                        }

                        let literal = &self.source[self.start..self.current];

                        let number: f64 = literal.parse().unwrap();

                        self.tokens.push(Token {
                            typ: TokenType::Number,
                            column: start_column,
                            line: start_line,
                            literal: Some(Literal::Number(number)),
                            lexeme: literal.to_string(),
                        });
                    } else if is_alpha(&c) {
                        while is_alphanumeric(&self.peek()) {
                            self.advance(1);
                        }

                        let identifier = &self.source[self.start..self.current];

                        if let Some(typ) = keywords.get(identifier) {
                            self.tokens.push(Token {
                                typ: typ.clone(),
                                column: start_column,
                                line: start_line,
                                literal: None,
                                lexeme: identifier.to_string(),
                            });
                        } else {
                            if self.options.allow_unquoted_identifier {
                                // allow option
                                self.tokens.push(Token {
                                    typ: TokenType::Identifier,
                                    column: start_column,
                                    line: start_line,
                                    literal: None,
                                    lexeme: identifier.to_string(),
                                });
                            } else {
                                return Err(Error::SyntaxError(format!(
                                    "Unquoted identifiers are not allowed '{}' at {}:{}.",
                                    identifier, start_line, start_column
                                )));
                            }
                        }
                    } else {
                        return Err(Error::SyntaxError(format!(
                            "Unexpected token '{}' at {}:{}.",
                            *&c as char, self.line, self.column
                        )));
                    }
                }
            }
        }

        self.tokens.push(Token {
            typ: TokenType::Eof,
            line: self.line,
            column: self.column,
            lexeme: "\0".to_string(),
            literal: None,
        });

        Ok(self.tokens.clone())
    }

    // fn number(&mut self) -> f64 {

    // }

    fn add_token(&mut self, typ: TokenType) {
        self.tokens.push(Token {
            column: self.column,
            line: self.line,
            lexeme: self.source[self.start..self.current + 1].to_string(),
            literal: None,
            typ,
        });

        self.advance(1);
    }

    fn advance(&mut self, columns: usize) -> u8 {
        self.current = self.current + 1;
        self.column = self.column + columns;

        self.source.as_bytes()[self.current - 1]
    }

    fn new_line(&mut self) {
        self.line = self.line + 1;
        self.column = 0;

        self.advance(1);
    }

    fn peek_last(&self) -> u8 {
        self.source.as_bytes()[self.current - 1]
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
