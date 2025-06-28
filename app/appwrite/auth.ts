'use client';

import { account, appwriteConfig, database } from "~/appwrite/client";
import { ID, OAuthProvider, Query } from "appwrite";
import { redirect } from "react-router";

/**
 * Get an existing user by Appwrite account ID
 */
export const getExistingUser = async (id: string) => {
    try {
        const { documents, total } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", id)]
        );
        return total > 0 ? documents[0] : null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

/**
 * Store user data after OAuth login
 */
export const storeUserData = async () => {
    try {
        const user = await account.get();
        if (!user) throw new Error("User not found");

        // Prevent duplicates
        const existingUser = await getExistingUser(user.$id);
        if (existingUser) return existingUser;

        // Get access token and fetch Google profile picture
        const session = await account.getSession("current");
        const profilePicture = session?.providerAccessToken
            ? await getGooglePicture(session.providerAccessToken)
            : null;

        // Create user document
        const createdUser = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: user.$id,
                email: user.email,
                name: user.name,
                imageUrl: profilePicture,
                joinedAt: new Date().toISOString(),
                status: "admin", // Add this if needed for role-based routing
            }
        );

        if (!createdUser?.$id) {
            console.warn("Failed to create user document.");
            return redirect("/sign-in");
        }

        return createdUser;
    } catch (error) {
        console.error("Error storing user data:", error);
        return null;
    }
};


/**
 * Get Google profile picture from OAuth token
 */
const getGooglePicture = async (accessToken: string) => {
    try {
        const response = await fetch(
            "https://people.googleapis.com/v1/people/me?personFields=photos",
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) throw new Error("Failed to fetch Google profile picture");

        const { photos } = await response.json();
        return photos?.[0]?.url || null;
    } catch (error) {
        console.error("Error fetching Google picture:", error);
        return null;
    }
};

/**
 * Login via Google OAuth2
 */
export const loginWithGoogle = async () => {
    try {
        account.createOAuth2Session(
            OAuthProvider.Google,
            `${window.location.origin}/dashboard`, // Success redirect
            `${window.location.origin}/sign-in` // Failure redirect
        );
    } catch (error) {
        console.error("Error during OAuth2 session creation:", error);
    }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
    try {
        await account.deleteSession("current");
        return true;
    } catch (error) {
        console.error("Error during logout:", error);
        return false;
    }
};

/**
 * Get currently logged-in user (DB)
 */
export const getUser = async () => {
    try {
        const user = await account.get();
        if (!user) return redirect("/sign-in");// or your logic
        return {
            name: user.name,
            email: user.email,
            imageUrl: (user as any).imageUrl ?? '/assets/images/david.webp'
        };
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

/**
 * Get the current authenticated user's ID
 */
export const getCurrentUser = async (): Promise<string | null> => {
    try {
        const user = await account.get();
        return user?.$id || null;
    } catch (error) {
        console.error("Error fetching current user ID:", error);
        return null;
    }
};
