# Batman Project

## Overview

The Batman project is a Discord bot designed to interact with Minecraft servers using the Discord.js and Mineflayer libraries. This bot supports various functionalities, such as connecting to Minecraft servers, monitoring server status, and providing interaction through Discord commands.

## Features

- **Connect to Minecraft servers**: Initiate and manage connections to multiple Minecraft servers.
- **Disconnect from servers**: Safely disconnect from servers when needed.
- **Monitor server interactions**: Receive and respond to messages and events from Minecraft servers.
- **Performance monitoring**: Integrated with Sentry for performance and error monitoring.

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (>= 14.x)
- Docker (for containerized deployment)
- Docker Compose

## Setup

### Configuration

1. **Config File**: Rename `config.yml.sample` to `config.yml` and fill in the required configuration details.
2. **Environment Variables**: Set up your environment variables in the `config.yml` file, especially the `SENTRY_DSN` for error tracking and `DISCORD_TOKEN` for your bot.

### Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/Nimon77/Batman.git
    cd Batman
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

### Running the Bot

1. **Local Development**:
    ```sh
    node app.js
    ```

2. **Using Docker**:

    - Build the Docker image:
        ```sh
        docker build -t batman-bot .
        ```

    - Run the container:
        ```sh
        docker-compose up -d
        ```

## Usage

### Available Commands

- **/connect [server]**: Connect to a specified Minecraft server or all configured servers.
- **/disconnect [server]**: Disconnect from a specified server or all servers if no server is specified.
- **/say [server] [message]**: Send the specified message to the specifier minecraft server

### Error Monitoring

The bot uses Sentry for monitoring errors and performance. Ensure the `SENTRY_DSN` is correctly set in your configuration file to enable this feature.

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/fooBar`).
3. Commit your changes (`git commit -am 'Add some fooBar'`).
4. Push to the branch (`git push origin feature/fooBar`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any issues or inquiries, please contact the project maintainer via [GitHub](https://github.com/Nimon77).
