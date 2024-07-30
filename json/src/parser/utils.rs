pub fn is_digit(c: &u8) -> bool {
    c >= &b'0' && c <= &b'9'
}

pub fn is_alpha(c: &u8) -> bool {
    (c >= &b'a' && c <= &b'z') || (c >= &b'A' && c <= &b'Z') || c == &b'_'
}

pub fn is_alphanumeric(c: &u8) -> bool {
    is_alpha(c) || is_digit(c)
}
