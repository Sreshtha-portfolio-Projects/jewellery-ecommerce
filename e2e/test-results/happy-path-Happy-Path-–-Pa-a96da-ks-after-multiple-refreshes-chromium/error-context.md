# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Aldorado Jewells" [level=1] [ref=e6]
    - heading "Customer Login" [level=2] [ref=e7]
  - generic [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]: Email
      - textbox "Email" [ref=e11]:
        - /placeholder: your@email.com
    - generic [ref=e12]:
      - generic [ref=e13]: Password
      - textbox "Password" [ref=e14]:
        - /placeholder: Enter your password
    - button "Login" [ref=e15] [cursor=pointer]
  - generic [ref=e16]:
    - generic [ref=e21]: Or continue with
    - button "Continue with Google" [ref=e22] [cursor=pointer]:
      - img [ref=e23]
      - text: Continue with Google
  - generic [ref=e28]:
    - link "Forgot password?" [ref=e29] [cursor=pointer]:
      - /url: /forgot-password
    - paragraph [ref=e30]:
      - text: Don't have an account?
      - link "Sign up" [ref=e31] [cursor=pointer]:
        - /url: /signup
```