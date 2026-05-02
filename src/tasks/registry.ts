import { Registry } from '../registry';
import { Task } from './task';
import UnbanTask from './impl/unban';

class _TaskRegistry extends Registry<new (context: any) => Task<any>> {}

const registry = new _TaskRegistry();
registry.register('unban_task', UnbanTask);

export const TaskRegistry = registry;