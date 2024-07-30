use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Token {
    pub typ: TokenType,
    pub lexeme: String,
    pub line: usize,
    pub column: usize,
    pub literal: Option<Literal>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TokenType {
    // Single character tokens
    LeftBrace,
    RightBrace,
    DoubleQuote,
    Colon,
    LeftSquareBracket,
    RightSquareBracket,
    Comma,
    Eof,

    // Literals
    Number,
    String,
    Null,
    True,
    False,

    Identifier,
}

#[derive(Debug, Clone)]
pub enum Literal {
    String(String),
    Number(f64),
    True,
    False,
    Null,
}

pub fn keywords() -> HashMap<&'static str, TokenType> {
    let mut map: HashMap<&str, TokenType> = HashMap::new();

    map.insert("null", TokenType::Null);
    map.insert("true", TokenType::True);
    map.insert("false", TokenType::False);

    map
}
