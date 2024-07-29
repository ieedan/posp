use tokens::Token;

pub mod scanner;

pub mod tokens;

pub mod error;

struct Parser {
    tokens: Vec<Token>
}