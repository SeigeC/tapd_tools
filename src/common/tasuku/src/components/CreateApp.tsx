import { render } from 'ink';
import React from 'react';
import { TaskList } from '../types';
import TaskListApp from './TaskListApp.js';

export function createApp(taskList: TaskList) {
	const inkApp = render(<TaskListApp taskList={taskList} />);

	return {
		remove() {
			inkApp.rerender(null);
			inkApp.unmount();
			inkApp.clear();
			inkApp.cleanup();
		},
	};
}
