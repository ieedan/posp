use std::fs;

use json::parser::{error::Error, Options, Parser, Value};

fn main() -> Result<(), Error> {
    let source: String = fs::read_to_string("test.json").unwrap();

    let mut parser: Parser = Parser::new(source, Options::js());

    let result: Value =  parser.parse()?;

    dbg!(result);

    Ok(())
}
