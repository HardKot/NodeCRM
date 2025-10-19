import { getValue, increment } from '../../deps.js';

function Controller() {
  return function (target: any) {
    target.isController = true;
  };
}

function Get() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.getHandlers) target.getHandlers = {};
    target.getHandlers[propertyKey] = descriptor.value;
  };
}

@Controller()
export default class StaffControllers {
  @Get()
  async getStaffList() {
    return new Response('Hello, this is a GET request from StaffControllers!');
  }

  post() {
    console.log('patient', getValue());
    increment();
    console.log('patient', getValue());
    return new Response('Hello, this is a POST request from StaffControllers!');
  }
}
