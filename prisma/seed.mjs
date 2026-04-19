import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      email: "andre@emailteste.com",
      username: "cptandrew",
      password: "123456",
      level: 4,
      xp: 420,
    },
    {
      email: "ana@emailteste.com",
      username: "obliviox",
      password: "123456",
      level: 3,
      xp: 305,
    },
    {
      email: "guilherme@emailteste.com",
      username: "mestredoexcel",
      password: "123456",
      level: 2,
      xp: 210,
    },
    {
      email: "william@emailteste.com",
      username: "williansnelli",
      password: "123456",
      level: 5,
      xp: 560,
    },
  ];

  const mockEmails = users.map((user) => user.email);

  await prisma.studySession.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.area.deleteMany();
  await prisma.badge.deleteMany();

  await prisma.user.deleteMany({
    where: {
      email: {
        notIn: mockEmails,
      },
    },
  });

  for (const user of users) {
    const hashedPassword = await hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        password: hashedPassword,
        level: user.level,
        xp: user.xp,
      },
      create: {
        email: user.email,
        username: user.username,
        password: hashedPassword,
        level: user.level,
        xp: user.xp,
      },
    });
  }

  await prisma.area.createMany({
    data: [
      { areaName: "Humanas", areaDescription: "Matérias de ciências humanas" },
      { areaName: "Linguagens", areaDescription: "Leitura e escrita" },
      { areaName: "Exatas", areaDescription: "Cálculo e lógica" },
    ],
  });

  const areas = await prisma.area.findMany();
  const areaByName = Object.fromEntries(areas.map((area) => [area.areaName, area]));

  await prisma.subject.createMany({
    data: [
      {
        subjectName: "Literatura",
        subjectDescription: "Modernismo e interpretacao de texto",
        areaId: areaByName.Linguagens.id,
      },
      {
        subjectName: "Produção de texto",
        subjectDescription: "Redação dissertativa",
        areaId: areaByName.Linguagens.id,
      },
      {
        subjectName: "História",
        subjectDescription: "Brasil colônia e império",
        areaId: areaByName.Humanas.id,
      },
      {
        subjectName: "Matemática",
        subjectDescription: "Funções e estatística",
        areaId: areaByName.Exatas.id,
      },
    ],
  });

  await prisma.badge.createMany({
    data: [
      {
        badgeName: "Primeiro Registro",
        badgeDescription: "Registrou a primeira sessão de estudo",
        rarity: 1,
      },
      {
        badgeName: "Semana Consistente",
        badgeDescription: "Estudou por sete dias no período",
        rarity: 2,
      },
      {
        badgeName: "Mestre das Exatas",
        badgeDescription: "Acumulou 5 sessões em Exatas",
        rarity: 3,
      },
    ],
  });

  const [userRows, subjectRows, badgeRows] = await Promise.all([
    prisma.user.findMany({ where: { email: { in: mockEmails } } }),
    prisma.subject.findMany(),
    prisma.badge.findMany(),
  ]);

  const userByEmail = Object.fromEntries(userRows.map((user) => [user.email, user]));
  const subjectByName = Object.fromEntries(subjectRows.map((subject) => [subject.subjectName, subject]));
  const badgeByName = Object.fromEntries(badgeRows.map((badge) => [badge.badgeName, badge]));

  await prisma.studySession.createMany({
    data: [
      {
        userId: userByEmail["andre@emailteste.com"].id,
        subjectId: subjectByName.Literatura.id,
        studyTime: 123,
        questions: 18,
        rate: 4,
      },
      {
        userId: userByEmail["andre@emailteste.com"].id,
        subjectId: subjectByName["Produção de texto"].id,
        studyTime: 95,
        questions: 10,
        rate: 5,
      },
      {
        userId: userByEmail["ana@emailteste.com"].id,
        subjectId: subjectByName["História"].id,
        studyTime: 85,
        questions: 14,
        rate: 4,
      },
      {
        userId: userByEmail["ana@emailteste.com"].id,
        subjectId: subjectByName.Literatura.id,
        studyTime: 62,
        questions: 8,
        rate: 3,
      },
      {
        userId: userByEmail["guilherme@emailteste.com"].id,
        subjectId: subjectByName["Matemática"].id,
        studyTime: 140,
        questions: 24,
        rate: 4,
      },
      {
        userId: userByEmail["william@emailteste.com"].id,
        subjectId: subjectByName["Matemática"].id,
        studyTime: 180,
        questions: 32,
        rate: 5,
      },
      {
        userId: userByEmail["william@emailteste.com"].id,
        subjectId: subjectByName["História"].id,
        studyTime: 90,
        questions: 12,
        rate: 4,
      },
    ],
  });

  await prisma.userBadge.createMany({
    data: [
      {
        userId: userByEmail["andre@emailteste.com"].id,
        badgeId: badgeByName["Primeiro Registro"].id,
      },
      {
        userId: userByEmail["andre@emailteste.com"].id,
        badgeId: badgeByName["Semana Consistente"].id,
      },
      {
        userId: userByEmail["ana@emailteste.com"].id,
        badgeId: badgeByName["Primeiro Registro"].id,
      },
      {
        userId: userByEmail["guilherme@emailteste.com"].id,
        badgeId: badgeByName["Primeiro Registro"].id,
      },
      {
        userId: userByEmail["william@emailteste.com"].id,
        badgeId: badgeByName["Primeiro Registro"].id,
      },
      {
        userId: userByEmail["william@emailteste.com"].id,
        badgeId: badgeByName["Mestre das Exatas"].id,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
