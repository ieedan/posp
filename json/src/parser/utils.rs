pub fn is_digit(char: &u8) -> bool {
    char >= &b'0' && char <= &b'9'
}

pub fn is_alpha(c: &u8) -> bool {
    (c >= &b'a' && c <= &b'z') || (c >= &b'A' && c <= &b'Z') || c == &b'_'
}
