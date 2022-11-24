import express from 'express';
import { type IKernelModuleInit } from '@kernel/Kernel.js';

export const init: IKernelModuleInit = async (context) => {
  context.kernelGlobals.express = express();
};
