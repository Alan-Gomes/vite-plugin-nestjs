/* eslint-disable */
export default async () => {
  const t = {};
  return {
    "@nestjs/swagger": {
      models: [],
      controllers: [
        [
          import("./app.controller"),
          {
            AppController: {
              getHello: {
                summary: "This is a test",
                description: "A greeting string",
                type: String,
              },
            },
          },
        ],
      ],
    },
  };
};
