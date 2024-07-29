use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    /// Error occurs during the parsing step
    #[error("Syntax Error: {0}")]
    SyntaxError(String),
}
