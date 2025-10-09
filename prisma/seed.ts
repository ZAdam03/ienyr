// import { PrismaClient } from "@/generated/prisma";

// const prisma = new PrismaClient();

// async function main() {
//     // Példa adatok a User táblához
//     const item1 = await prisma.item.create({
//         data: {
//             eid: '10011122',
//             description: 'nyomtató HP 3033 tip.',
//             type: 'nyomtató',
//             brand: 'HP',
//             model: '3033',
//             serialNumber: '123456789',
//             status: 'aktív',
//             toolbookItem: {

//             }
//         },
//     });

//     const user1 = await prisma.user.create({
//         data: {
//             name: 'Jane Smith',
//             email: 'jane.smith@example.com',
//             toolbook: {
//                 isActive: true,
//             }
//         },
//     });

//     console.log({ item1, item2 });
// }

// main()
//     .catch((e) => {
//         console.error(e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });