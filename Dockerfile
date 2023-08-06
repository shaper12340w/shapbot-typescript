FROM node:latest

RUN mkdir -p /docker
WORKDIR /docker

ADD . /docker

RUN npx tsc
RUN cp -r dist/* ./

CMD ["node", "app.js"]


