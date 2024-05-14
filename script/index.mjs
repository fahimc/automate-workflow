import { HttpWorkflow } from "./http-workflow.mjs";
import { ParseToJsonWorkflow } from "./parse-to-json.mjs";

const workflowConfig = {
  interval: 1000,
  items: [
    {
      id: "1",
      name: "get-birds",
      workflow: "HttpWorkflow",
      options: {
        url: "https://xeno-canto.org/api/2/recordings",
        queryParams: {
          query: "cnt:brazil",
        },
      },
      inputId: null,
      outputId: "2",
    },
    {
      id: "2",
      name: "ParseToJson",
      workflow: "ParseToJsonWorkflow",
      options: {
        data: "[DATA_FROM_PREVIOUS_WORKFLOW]",
      },
      inputId: "1",
      output: null,
    },
  ],
};

const execute = (item) => {
  let workflow;
  switch (item.workflow) {
    case "HttpWorkflow":
      workflow = new HttpWorkflow(item.options);
      break;
    case "ParseToJsonWorkflow":
      workflow = new ParseToJsonWorkflow(item.options);
      break;
    default:
      break;
  }
  workflow.run().then((data) => {
    console.log(data);
    if (item.outputId) {
      const nextItem = workflowConfig.items.find((i) => i.id === item.outputId);
      Object.keys(nextItem.options).forEach((key) => {
        nextItem.options[key] = nextItem.options[key].replace(
          "[DATA_FROM_PREVIOUS_WORKFLOW]",
          data
        );
      });
      execute(nextItem);
    }
  });
};

const runner = () => {
  const firstItem = workflowConfig.items.find((item) => item.inputId === null);
  execute(firstItem);
};

runner();
