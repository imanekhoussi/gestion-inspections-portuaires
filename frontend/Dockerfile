# Build Angular
FROM node:20 as build

WORKDIR /app

COPY package*.json ./

# IMPORTANT : utiliser legacy peer deps
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
