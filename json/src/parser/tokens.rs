#[derive(Debug, Clone)]
pub struct Token {
    pub typ: TokenType,
    pub lexeme: String,
    pub line: usize,
    pub column: usize,
    pub literal: Option<Literal>
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
}

#[derive(Debug, Clone)]
pub enum Literal {
    String(String),
    Number(f64),
    Null,
}