FROM nginx:1.27-alpine

COPY deploy/docker/nginx/gateway.conf /etc/nginx/conf.d/default.conf
