import { isValidPassword } from "../../src/validaPassword";

test("Deve validar a senha", () => {
    const password = "asdQWE123";
    const isValid = isValidPassword(password);
    expect(isValid).toBe(true);
});

test.each([
    "asd",
    "asdquezxc",
    "ASDQWEXCV",
    "asdqwe123"
])("Não deve validar a senha", (pasword: string) => {
    const password = "asdQWE123";
    const isValid = isValidPassword(password);
    expect(isValid).toBe(false);
});
