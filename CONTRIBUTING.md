# Hướng dẫn đóng góp

Cảm ơn bạn đã quan tâm đến việc đóng góp cho DX-FSM!

## Quy trình đóng góp

### 1. Fork repository

Fork repository này về tài khoản GitHub của bạn.

### 2. Clone về máy local

```bash
git clone https://github.com/<your-username>/dx-fsm.git
cd dx-fsm
git remote add upstream https://github.com/<team>/dx-fsm.git
```

### 3. Tạo branch mới

```bash
git checkout -b feature/your-feature-name
# hoặc
git checkout -b fix/issue-description
```

Quy ước đặt tên branch:
- `feature/` – tính năng mới
- `fix/` – sửa lỗi
- `docs/` – cập nhật tài liệu
- `refactor/` – cải thiện code

### 4. Code và commit

```bash
# Thực hiện thay đổi
git add .
git commit -m "feat: add new feature description"
```

Quy ước commit message theo [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add ticket priority feature
fix: resolve AI classification timeout issue
docs: update API documentation
refactor: simplify ticket service structure
test: add unit tests for classifier
chore: update dependencies
```

### 5. Push lên GitHub

```bash
git push origin feature/your-feature-name
```

### 6. Tạo Pull Request

1. Mở Pull Request từ branch của bạn vào `main` của repository gốc
2. Điền mô tả rõ ràng về thay đổi
3. Liên kết issue nếu có
4. Đợi review

## Tiêu chuẩn code

### Python (Services)

- Tuân thủ [PEP 8](https://pep8.org/)
- Sử dụng `ruff` để lint và format
- Type hints cho tất cả function
- Docstring cho public functions

```bash
# Lint
ruff check services/

# Format
ruff format services/
```

### TypeScript/Vue (Frontend)

- Sử dụng ESLint + Prettier
- Composition API cho Vue 3
- TypeScript strict mode

```bash
# Lint
npm run lint

# Format
npm run format
```

### Git

- Không commit: `.env`, secrets, passwords, API keys
- Không commit: `node_modules/`, `target/`, `__pycache__/`, `.venv/`
- Mỗi commit nên là một đơn vị thay đổi logic có ý nghĩa

## Cấu trúc commit

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Báo cáo lỗi

Sử dụng [GitHub Issues](https://github.com/<team>/dx-fsm/issues) với template:

- Mô tả rõ vấn đề
- Các bước tái hiện
- Kết quả mong đợi vs thực tế
- Environment (OS, Docker version, browser...)

## Liên hệ

Mọi thắc mắc, vui lòng tạo GitHub Discussion hoặc liên hệ qua email.

---

**Cảm ơn bạn đã đóng góp!**
