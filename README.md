---

# 🏛 Enterprise System Architecture

```text
                                    ┌────────────────────────────┐
                                    │         End Users          │
                                    │  Web Browser / Mobile App  │
                                    └─────────────┬──────────────┘
                                                  │
                                           HTTPS / SSL
                                                  │
                                                  ▼
                         ┌────────────────────────────────────┐
                         │     React + TypeScript Frontend    │
                         │------------------------------------│
                         │ • Authentication UI                │
                         │ • AI Chat Interface                │
                         │ • Dashboard                        │
                         │ • Document Upload                  │
                         │ • Analytics                        │
                         │ • Admin Panel                      │
                         └──────────────┬─────────────────────┘
                                        │
                                  REST API / WebSocket
                                        │
                                        ▼
                     ┌──────────────────────────────────────────┐
                     │      Java Spring Boot Backend            │
                     │------------------------------------------│
                     │ Spring Security                          │
                     │ JWT Authentication                       │
                     │ User Management                          │
                     │ Chat Service                             │
                     │ Document Service                         │
                     │ AI Integration Service                   │
                     │ Notification Service                     │
                     │ Admin Service                            │
                     └──────────────┬───────────────────────────┘
                                    │
      ┌─────────────────────────────┼──────────────────────────────┐
      │                             │                              │
      ▼                             ▼                              ▼
┌──────────────┐           ┌────────────────┐             ┌────────────────┐
│ PostgreSQL   │           │ Redis Cache   │             │ Gemini AI API  │
│--------------│           │---------------│             │----------------│
│ Users        │           │ Session Cache │             │ AI Responses   │
│ Chats        │           │ JWT Cache     │             │ Context        │
│ Messages     │           │ Chat Cache    │             │ Embeddings     │
│ Documents    │           │ Rate Limits   │             │ Text Generation│
│ Analytics    │           └────────────────┘             └────────────────┘
└──────────────┘
                │
                ▼
     ┌───────────────────────────┐
     │      File Storage          │
     │----------------------------│
     │ PDF Documents              │
     │ Images                     │
     │ DOCX Files                 │
     │ CSV Files                  │
     └───────────────────────────┘
                │
                ▼
      ┌────────────────────────────┐
      │      Docker Containers     │
      │----------------------------│
      │ React Frontend             │
      │ Spring Boot Backend        │
      │ PostgreSQL                 │
      │ Redis                      │
      │ Nginx Reverse Proxy        │
      └──────────────┬─────────────┘
                     │
                     ▼
          ┌─────────────────────────┐
          │      AWS Cloud          │
          │-------------------------│
          │ EC2                     │
          │ S3                      │
          │ CloudWatch              │
          │ GitHub Actions CI/CD    │
          └─────────────────────────┘
```

---

# 🏗 Architecture Layers

## 1. Presentation Layer
- React
- TypeScript
- Tailwind CSS
- Material UI
- Responsive Design
- Dark/Light Theme

---

## 2. API Layer
- REST APIs
- WebSocket
- JWT Authentication
- Input Validation
- Global Exception Handling

---

## 3. Business Layer
- User Management
- AI Chat Service
- Document Processing
- Analytics Service
- Notification Service
- Admin Management

---

## 4. AI Layer
- Google Gemini API
- LangChain
- Retrieval-Augmented Generation (RAG)
- Prompt Engineering
- Conversation Memory
- Semantic Search

---

## 5. Data Layer
- PostgreSQL
- Redis Cache
- File Storage
- Vector Embeddings

---

## 6. DevOps Layer
- Docker
- Docker Compose
- GitHub Actions
- AWS EC2
- Nginx
- SSL/HTTPS

---

# 🔄 Application Workflow

```text
User
   │
   ▼
React Frontend
   │
JWT Authentication
   │
Spring Boot REST API
   │
Business Logic
   │
───────────────
│ PostgreSQL │
│ Redis      │
│ Gemini AI  │
───────────────
   │
AI Response
   │
Spring Boot
   │
React Frontend
   │
User
```

---

# 📐 Design Patterns Used

- MVC Architecture
- Layered Architecture
- Repository Pattern
- Service Layer Pattern
- DTO Pattern
- Builder Pattern
- Factory Pattern
- Singleton Pattern
- Dependency Injection
- Strategy Pattern
- Observer Pattern
