FROM nginx:1.27-alpine

WORKDIR /var/www/html
COPY public ./public
COPY deploy/docker/nginx/laravel.conf /etc/nginx/conf.d/default.conf
RUN ln -s /var/www/html/storage/app/public /var/www/html/public/storage
