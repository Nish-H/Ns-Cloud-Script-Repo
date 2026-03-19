#requires -Version 5.1

# Module: NsCloudRepository
# Description: Module to interact with the NsCloudScriptRepo from anywhere
# Author: NishH

#region Private variables
$script:BaseUrl = "https://dev-ops-studio.vercel.app" # Can be overridden by setting the environment variable NS_CLOUD_REPO_BASE_URL
$script:Token = $null # Secure string to hold the JWT token
#endregion

#region Private functions
function ConvertTo-PlainText {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true)]
        [System.Security.SecureString]
        $SecureString
    )
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($BSTR)
    } finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    }
}
#endregion

#region Public functions
function Set-NsRepoToken {
    <#
    .SYNOPSIS
    Sets the JWT token for authenticating with the NsCloudScriptRepo.
    .DESCRIPTION
    This function accepts a JWT token (as a string or secure string) and stores it securely for use by other functions in the module.
    .PARAMETER Token
    The JWT token obtained from the PowerShell Repository Access page (after GitHub login).
    Can be provided as a plain string or a SecureString.
    .EXAMPLE
    $token = Read-Host -AsSecureString "Enter your token"
    Set-NsRepoToken -Token $token
    #>
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true, ValueFromPipeline=$true)]
        [AllowNull()]
        [AllowEmptyString()]
        [object]
        $Token
    )

    if ($null -eq $Token) {
        $script:Token = $null
        return
    }

    if ($Token -is [System.Security.SecureString]) {
        $script:Token = $Token
    } elseif ($Token -is [string]) {
        $secureToken = ConvertTo-SecureString -String $Token -AsPlainText -Force
        $script:Token = $secureToken
    } else {
        throw "Token must be a string or a SecureString."
    }
}

function Get-NsScriptList {
    <#
    .SYNOPSIS
    Gets a list of available PowerShell scripts from the repository.
    .DESCRIPTION
    This function calls the repository API to retrieve the names of all scripts in the scripts folder.
    .OUTPUTS
    System.String[]
    An array of script names (without the .ps1 extension if present, but we return the actual file names).
    .EXAMPLE
    $scripts = Get-NsScriptList
    $scripts | ForEach-Object { Write-Host $_ }
    #>
    [CmdletBinding()]
    param ()

    if (-not $script:Token) {
        throw "Token not set. Please use Set-NsRepoToken to set your JWT token first."
    }

    try {
        $plainToken = ConvertTo-PlainText -SecureString $script:Token
        $headers = @{ Authorization = "Bearer $plainToken" }

        $response = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/scripts" -Headers $headers -ErrorAction Stop
        return $response.scripts
    } catch {
        throw "Failed to retrieve script list: $($_.Exception.Message)"
    }
}
#endregion

Export-ModuleMember -Function *
