import { closeDb } from "@aihot/backend/db";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { installModules } from "@aihot/backend/modules";
import { composeDueReports } from "@aihot/backend/reports/compose";
import { SERVER_MODULES } from "@aihot/site/modules/server";

installModules(SERVER_MODULES);
try {
  console.log(JSON.stringify(await composeDueReports()));
} finally {
  await stopBoss();
  await closeDb();
}
