import { html } from 'lit';

// Mock Home Assistant global styles
const mockHaStyles = html`
  <style>
    :root {
      --primary-color: #03a9f4;
      --primary-background-color: #fafafa;
      --secondary-background-color: #e7e7e7;
      --primary-text-color: #212121;
      --secondary-text-color: #727272;
      --disabled-text-color: #bdbdbd;
      --divider-color: rgba(0, 0, 0, 0.12);
      --error-color: #db4437;
      --success-color: #0f9d58;
      --warning-color: #f4b400;
      --info-color: #039be5;
      --card-background-color: #ffffff;
      --ha-card-border-radius: 12px;
      --ha-card-box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
    }

    body {
      margin: 0;
      padding: 16px;
      font-family: Roboto, sans-serif;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
    }
  </style>
`;

export const decorators = [
  (story) => html`
    ${mockHaStyles}
    ${story()}
  `
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  }
};

