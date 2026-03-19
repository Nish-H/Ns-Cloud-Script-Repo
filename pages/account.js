import { getSession } from "next-auth/react"
import { signIn } from "next-auth/react"
import { useState } from "react"

export async function getServerSideProps(context) {
  const session = await getSession(context)
  if (!session) {
    // Not authenticated, redirect to sign-in page
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      session: session,
    },
  }
}

export default function Account({ session }) {
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)

  const generateToken = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/generate-token", {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error("Failed to generate token")
      }
      const data = await res.json()
      setToken(data.token)
    } catch (err) {
      console.error(err)
      alert("Could not generate token. Make sure you are logged in with GitHub.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>PowerShell Repository Access</h1>
      <p>
        Hello, {session.user.name}! You are signed in with GitHub as{" "}
        <strong>{session.user.email}</strong>.
      </p>
      <p>
        This tool allows you to generate a token to access your PowerShell scripts
        and upload reports from any PowerShell environment.
      </p>
      <p>
        <strong>Instructions:</strong>
      </p>
      <ol>
        <li>Click the "Generate PowerShell Token" button below.</li>
        <li>
          Copy the generated token and use it in your PowerShell scripts as
          shown in the documentation.
        </li>
      </ol>

      {token ? (
        <div style={{ marginTop: "1.5rem" }}>
          <h2>Your PowerShell Token (expires in 60 minutes)</h2>
          <p style={{ wordBreak: "break-all" }}>{token}</p>
          <button onClick={() => navigator.clipboard.writeText(token)}>
            Copy Token
          </button>
        </div>
      ) : (
        <button onClick={generateToken} disabled={loading}>
          {loading ? "Generating..." : "Generate PowerShell Token"}
        </button>
      )}
      <p>
        <small>
          Note: The token is valid for 60 minutes. After that, you'll need to
          generate a new one.
        </small>
      </p>
    </div>
  )
}
