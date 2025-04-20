FROM node:23-slim

# Set working directory
WORKDIR /app

#Install python3 and a virtual environment
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip

#Set the environment for python commands
ENV PATH="/opt/venv/bin:$PATH"

#Install python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy only package.json and package-lock.json first for caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the project files
COPY server.js compare.py ./
COPY public ./public

# Expose app port
EXPOSE 3000

# Start the Node.js server
CMD ["node", "server.js"]