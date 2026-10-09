const zustand = require('zustand/vanilla');

const useStore = zustand.createStore((set, get) => ({
  customers: [{ id: '1', name: 'Test', sopChecklist: {} }],
  updateCustomer: (id, patch) => {
    const c = get().customers.find(x => x.id === id);
    const next = { ...c, ...patch };
    set({ customers: get().customers.map(x => x.id === id ? next : x) });
  }
}));

console.log('Initial:', useStore.getState().customers[0].sopChecklist);

const ids = ['i_1_1', 'i_1_2'];
const checklist = useStore.getState().customers[0].sopChecklist || {};
const newChecklist = { ...checklist };
for (const id of ids) newChecklist[id] = true;

useStore.getState().updateCustomer('1', { sopChecklist: newChecklist });

console.log('After:', useStore.getState().customers[0].sopChecklist);
console.log('Matches?', useStore.getState().customers[0].sopChecklist['i_1_1'] === true);
