FROM node:18-slim

WORKDIR /app

COPY package.json ./
RUN npm install

# App code and seed data (app.js loads seeds from data/, with the service
# root as a fallback location).
COPY app.js review.js dealership.js inventory.js ./
COPY data/ ./data/

EXPOSE 3030

CMD ["node", "app.js"]
