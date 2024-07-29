use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Token {
    pub typ: TokenType,
    pub lexeme: String,
    pub line: usize,
    pub column: usize,
    pub literal: Option<Literal>,
}

#[derive(Debug, Clone)]
pub enum TokenType {
    // Single character tokens
    LeftBrace,
    RightBrace,
    DoubleQuote,
    Colon,
    LeftSquareBracket,
    RightSquareBracket,
    Comma,
    EOF,

    // Literals
    Number,
    String,
    Null,
}

#[derive(Debug, Clone)]
pub enum Literal {
    String(String),
    Number(f64),
    Null,
}

pub fn keywords() -> HashMap<&'static str, TokenType> {
    let mut map: HashMap<&str, TokenType> = HashMap::new();

    map.insert("null", TokenType::Null);

    map
}
