// @ts-check

import { StylableWebpackPlugin } from '@stylable/webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

/** @type {import('webpack').Configuration} */
export default {
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        port: 55100,
        client: {
          overlay: {
            errors: true,
            warnings: false,
          },
        },
      },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg|eot|ttf|woff|woff2)$/,
                type: 'asset',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    plugins: [
        new StylableWebpackPlugin({ stcConfig: true }),
        new HtmlWebpackPlugin({ title: 'Stylable App', template: 'index.html' }),
    ],
    cache: { type: 'filesystem' },
};
