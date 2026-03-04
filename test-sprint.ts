import { createSprint } from './src/lib/actions/sprints';

async function test() {
    const result = await createSprint('test-project-id', {
        goal: 'Test sprint',
        planned_end_at: new Date().toISOString(),
        status: 'planning',
    });
    console.log('Result:', result);
}
test();
