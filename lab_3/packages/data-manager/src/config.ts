interface ServerConfig {
  rabbitmq: {
    url: string;
    queue: string;
    host: string;
    port: number;
    user: string;
    password: string;
  };
  apiServer: {
    port: number;
    apiPorts: { [key: string]: number };
  };
  ftp: {
    host: string;
    user: string;
    password: string;
    port: number;
    checkInterval: number;
  };
}

export const config: ServerConfig = {
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || "rabbitmq",
    port: parseInt(process.env.RABBITMQ_PORT || "5672"),
    user: process.env.RABBITMQ_USER || "user",
    password: process.env.RABBITMQ_PASSWORD || "password",
    url: `amqp://${process.env.RABBITMQ_USER || "user"}:${
      process.env.RABBITMQ_PASSWORD || "password"
    }@${process.env.RABBITMQ_HOST || "rabbitmq"}:${
      process.env.RABBITMQ_PORT || "5672"
    }`,
    queue: process.env.QUEUE_NAME || "scraped_products",
  },
  apiServer: {
    port: parseInt(process.env.DATA_MANAGER_PORT || "8080"),
    apiPorts: {
      "1": parseInt(process.env.API_SERVER_1_PORT || "8000"),
      "2": parseInt(process.env.API_SERVER_2_PORT || "8001"),
      "3": parseInt(process.env.API_SERVER_3_PORT || "8002"),
    },
  },
  ftp: {
    host: process.env.FTP_HOST || "ftp_server",
    user: process.env.FTP_USER || "testuser",
    password: process.env.FTP_PASSWORD || "testpass",
    port: parseInt(process.env.FTP_CONTROL_PORT || "21"),
    checkInterval: parseInt(process.env.FTP_CHECK_INTERVAL || "30000"),
  },
};
