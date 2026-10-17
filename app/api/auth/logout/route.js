export async function POST() {
  const response = Response.json({
    success: true,
    message: "Logged out successfully"
  });

  response.headers.append(
    "Set-Cookie",
    "token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0"
  );

  return response;
}
