import { prisma } from "../src/lib/prisma";

async function main() {
  const sheetId = process.env.GOOGLE_SHEET_ID || "10Dg-4NwS3mpBCVeWCIFv-djoxr2bEQoZVViFd_Gk3p8";
  
  // 1. Create default owner user
  const owner = await prisma.user.upsert({
    where: { email: "system@example.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "system@example.com",
    },
  });

  // 2. Create the default project
  const project = await prisma.project.upsert({
    where: { slug: "default" },
    update: {
      name: "QA Board (Default)",
    },
    create: {
      name: "QA Board (Default)",
      slug: "default",
      ownerId: owner.id,
    },
  });

  // 3. Create Project Membership for Owner
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: owner.id,
      },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: owner.id,
      roles: ["OWNER"],
    },
  });

  // 4. Create Sheet Config
  await prisma.sheetConfig.deleteMany({ where: { projectId: project.id } });
  await prisma.sheetConfig.create({
    data: {
      projectId: project.id,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      sheetId: sheetId,
      selectedTabs: ["Admin", "App"],
      headerRow: 9,
      dataStartRow: 10,
    },
  });

  // 5. Create Column Mappings
  const columns = {
    module: 0,
    feature: 1,
    issueTitle: 2,
    issueDescription: 3,
    stepsToReproduce: 4,
    resources: 5,
    issueStatus: 6,
    reportedBy: 7,
    devComments: 8,
    estimation: 9,
    spentTime: 10,
    assignedDate: 11,
    assignee: 12,
    resolutionDate: 13,
    qaComments: 14,
  };

  await prisma.columnMapping.deleteMany({ where: { projectId: project.id } });
  
  for (const tab of ["Admin", "App"]) {
    for (const [fieldKey, columnIndex] of Object.entries(columns)) {
      await prisma.columnMapping.create({
        data: {
          projectId: project.id,
          tabName: tab,
          fieldKey,
          columnIndex,
        },
      });
    }
  }

  // 6. Create Status Configs
  const statuses = [
    { value: "TODO", label: "TODO", color: "#64748b", category: "open" as const },
    { value: "IN PROGRESS", label: "IN PROGRESS", color: "#0ea5e9", category: "open" as const },
    { value: "NOT RESOLVED", label: "NOT RESOLVED", color: "#f43f5e", category: "open" as const },
    { value: "IN QA", label: "IN QA", color: "#f59e0b", category: "qa" as const },
    { value: "FIXED", label: "FIXED", color: "#a855f7", category: "fixed" as const },
    { value: "RESOLVED", label: "RESOLVED", color: "#10b981", category: "closed" as const },
    { value: "NOT NEEDED", label: "NOT NEEDED", color: "#3c010bff", category: "other" as const },
  ];

  await prisma.statusConfig.deleteMany({ where: { projectId: project.id } });
  for (const status of statuses) {
    await prisma.statusConfig.create({
      data: {
        projectId: project.id,
        statusValue: status.value,
        displayLabel: status.label,
        color: status.color,
        category: status.category,
      },
    });
  }

  // 7. Create Metric Visibilities
  const metrics = [
    "todayFound",
    "todayResolved",
    "openIssues",
    "inQa",
    "fixedDeployed",
    "resolvedIssues",
    "workloadEstimation",
    "todayWorkload",
    "issuesByStatus",
    "openIssuesByAssignee",
    "assigneeStatusTable",
    "issuesByModule",
    "issuesReportedBy",
    "issueTable",
    "kanbanBoard",
  ];

  await prisma.metricVisibility.deleteMany({ where: { projectId: project.id } });
  for (const metric of metrics) {
    await prisma.metricVisibility.create({
      data: {
        projectId: project.id,
        metricKey: metric,
        enabled: true,
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
