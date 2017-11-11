FROM node
WORKDIR /cf-cli
COPY package.json /cf-cli
RUN npm install
ENV PATH="/cf-cli:${PATH}"
COPY . /cf-cli
RUN npm link
ENTRYPOINT ["node" ,"index.js"]