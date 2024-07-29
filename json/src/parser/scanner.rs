use std::fmt::format;

use super::{
    error::Error,
    tokens::{Token, TokenType},
};

pub struct Scanner {
    source: String,
    tokens: Vec<Token>,
    current: usize,
    line: usize,
    column: usize,
    start: usize,
}

impl Scanner {
    pub fn new(source: String) -> Self {
        Self {
            source,
            current: 0,
            line: 1,
            column: 1,
            start: 0,
            tokens: vec![],
        }
    }

    pub fn scan(&mut self) -> Result<Vec<Token>, Error> {
        while self.current < self.source.len() {
            let c = &self.source.as_bytes()[self.current];

            match c {
                b'{' => self.add_token(TokenType::LeftBrace),
                b'}' => self.add_token(TokenType::RightBrace),
                b':' => self.add_token(TokenType::Colon),
                b',' => self.add_token(TokenType::Comma),
                b'[' => self.add_token(TokenType::LeftSquareBracket),
                b']' => self.add_token(TokenType::RightSquareBracket),
                b'"' => {}
                _ => {
                    return Err(Error::SyntaxError(format!(
                        "Unexpected token '{}' at {}:{}.",
                        c, self.line, self.column
                    )))
                }
            }
        }

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

        self.source.as_bytes()[self.current - 1]
    }
}
