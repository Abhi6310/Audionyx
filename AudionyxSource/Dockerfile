FROM node:lts

# Install Python 3.9+ from source
RUN apt-get update && apt-get install -y \
    wget \
    build-essential \
    libffi-dev \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    libncurses5-dev \
    libncursesw5-dev \
    liblzma-dev \
    ffmpeg \
    && wget https://www.python.org/ftp/python/3.9.9/Python-3.9.9.tgz \
    && tar xvf Python-3.9.9.tgz \
    && cd Python-3.9.9 \
    && ./configure --enable-optimizations \
    && make \
    && make install \
    && cd .. \
    && rm -rf Python-3.9.9 Python-3.9.9.tgz \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify Python installation
RUN python3.9 --version && pip3 --version

# Set the working directory
WORKDIR /repository

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the application code
COPY . .

# Expose the application's port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
