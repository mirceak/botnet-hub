import express from 'express';
import { type IKernelModuleInit } from '@kernel/Kernel.js';

export const init: IKernelModuleInit = async (context) => {
  context.globals.express = express();
  context.globals.express.get('/', async (...[, res]) => {
    res.status(200).send('hello world');
  });
};
