FROM mhart/alpine-node:4
MAINTAINER clpalexandre@gmail.com

ENV appRoot /src
ENV NODE_ENV production

# Set the workdir
WORKDIR $appRoot

# Bundle app source
COPY . $appRoot

# Install app dependencies
RUN npm install

# Registry and Website
EXPOSE 1389

CMD [ "npm", "start"]