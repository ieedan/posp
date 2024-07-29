use tokens::Token;

pub mod scanner;

pub mod tokens;

pub mod error;

pub mod utils;

pub struct Options {
    pub allow_unquoted_identifier: bool,
    pub allow_trailing_comma: bool,
    pub allow_comments: bool,
}

struct Parser {
    tokens: Vec<Token>
}