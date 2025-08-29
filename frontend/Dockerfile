# 멀티스테이지 빌드 - 개발 환경
FROM node:18-alpine as development

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 개발 서버 실행
CMD ["npm", "start"]

# 프로덕션 빌드
FROM node:18-alpine as production

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# nginx 설정
FROM nginx:alpine

# nginx 설정 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 빌드된 파일 복사
COPY --from=production /app/build /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]

# 테스트 빌드
FROM node:18-alpine as test

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 테스트 실행
CMD ["npm", "test", "--", "--watchAll=false"] 