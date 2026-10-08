const fs = require('fs');
let c = fs.readFileSync('api/cron.ts', 'utf8');

// Change single row fetch to fetch all rows
c = c.replace(
  `.eq('id', 'global')
      .single();

    if (error || !row || !row.data) {
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    const appData = row.data as any;`,
  `// Fetch ALL rows (all tenants)
      .select('*');

    if (error || !row) {
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    
    let globalHasUpdates = false;
    const updatePromises = [];
    
    for (const tenantRow of row) {
      const appData = tenantRow.data as any;
      const tenantId = tenantRow.id;`
);

// Close the loop block at the bottom
c = c.replace(
  `if (hasUpdates) {
      await supabase.from('app_data').upsert({ id: 'global', data: appData });
    }

    return res.status(200).json({ success: true, updated: hasUpdates });`,
  `if (hasUpdates) {
        globalHasUpdates = true;
        updatePromises.push(supabase.from('app_data').upsert({ id: tenantId, data: appData }));
      }
    } // End tenant loop
    
    await Promise.all(updatePromises);
    return res.status(200).json({ success: true, updated: globalHasUpdates });`
);

fs.writeFileSync('api/cron.ts', c, 'utf8');
