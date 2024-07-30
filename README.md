# posp

posp (Piece of \*\*\*\* parsers). These are parser implementations never meant to see production but help me practice creating parsers.

> [!WARNING]
> These are just for practice and not to be used in production.

# json `./json`

A customizable recursive descent parser for JSON. Based on the [ECMA JSON standard](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf).

## Grammar

The following grammar syntax is based on the grammar syntax used in [Crafting Interpreters](https://craftinginterpreters.com/representing-code.html).

```
value     ->  object | array | literal
object    ->  "{" property* "}"
array     ->  "[" value* "]"
property  ->  identifier ":" (object | literal) ","?
literal   ->  string | number | "true" | "false"| "null"
```

## Options

The parser has some options for how it parses JSON.

```rs
pub struct Options {
    pub allow_unquoted_identifier: bool,
    pub allow_trailing_comma: bool,
    pub allow_single_quotes: bool,
    pub allow_comments: bool,
    pub tab_width: usize,
}
```

### `allow_unquoted_identifier`

Allows keys in objects to be unquoted like is valid in JavaScript.

<!-- Don't put json / js as a lang here it will format incorrectly -->

```
{
  foo: "bar"
}
```

### `allow_single_quotes`

Allows single quotes like is valid in JavaScript.

<!-- Don't put json / js as a lang here it will format incorrectly -->

```js
{
  'foo': 'bar',
}
```

### `allow_trailing_comma`

Allows trailing commas in objects and arrays.

<!-- Don't put json / js as a lang here it will format incorrectly -->

```
{
  "foo": ["bar", "bar", "bar",],
}
```

### `allow_comments`

Allows `//` and `/**/` style comments.

```json
{
  // foo bar
  "foo": "bar"
}
```

```json
{
  /* foo bar */
  "foo": "bar"
}
```

## Usage

Write your program.

```rs
use std::fs;

use json::parser::{error::Error, Options, Parser, Value};

fn main() -> Result<(), Error> {
    let source: String = fs::read_to_string("test.json").unwrap();

    let mut parser: Parser = Parser::new(Options::js());

    let result: Value =  parser.parse(source)?;

    dbg!(result);

    Ok(())
}
```

Add content to `test.json`.

```js
/* Using Options::js() will allow this to be parsed normally */
{
    hello: 'world',
    things: ['one', 'two', 'three'],
}
```

Run to get the ast

```
cargo run
```
