// inside POST
const { projectId } = await req.json();
const convo = await prisma.conversation.create({
    data: {
        // ownerId: session.user.id,
        title: "",
        projectId: projectId ?? null,
    },
    select: { id: true },
});
return NextResponse.json({ id: convo.id }, { status: 201 });