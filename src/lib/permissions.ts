// The site owner (you) is identified by the OWNER_EMAIL environment variable.
// The owner can see every room, public or private, and can manage any room.
export function isSiteOwner(email?: string | null): boolean {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return !!owner && !!email && email.trim().toLowerCase() === owner;
}
