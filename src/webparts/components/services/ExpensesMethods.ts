import { useState, useEffect } from 'react';
import { web } from "../../PnpUrl";

export function ExpensesMethods() {
    const [expenseData, setExpenseData] = useState<any[]>([]);

    // Upload image to Reciept picture library
    const uploadImageToLibrary = async (file: File): Promise<string> => {
        try {
            // Ensure the Reciept picture library exists
            const pictureLibrary = await web.lists.ensure('Reciept', 'Picture Library');
            
            // Upload file to the picture library
            const uploadResult = await pictureLibrary.list.rootFolder.files.add(file.name, file, true);
            
            // Return the server relative URL
            console.log("site url ", uploadResult.data.ServerRelativeUrl);
            return uploadResult.data.ServerRelativeUrl;
        } catch (error: any) {
            console.log("Error uploading image to library:", error);
            throw error;
        }
    };

    // Format image URL for Hyperlink and Picture column
    const formatImageForHyperlinkPicture = (imageUrl: string, description: string = "Receipt"): object | string => {
        if (!imageUrl) return "";
        
        // For Hyperlink and Picture column, SharePoint expects an object with Description and Url
        return {
            "Description": description,
            "Url": imageUrl
        };
    };

    // Parse image URL from Hyperlink and Picture column
    const parseImageFromHyperlinkPicture = (imageData: any): string | null => {
        if (!imageData) return null;
        
        // Handle different data types
        if (typeof imageData === 'string') {
            try {
                const parsed = JSON.parse(imageData);
                return parsed.Url || parsed.url || parsed.serverRelativeUrl || imageData;
            } catch (error) {
                // If it's not JSON, return as direct URL
                return imageData;
            }
        } else if (typeof imageData === 'object') {
            // If it's already an object, extract the URL
            return imageData.Url || imageData.url || imageData.serverRelativeUrl || null;
        }
        
        return null;
    };

    // Get image URL from Reciept list
    const getImageUrl = async (imageId: string): Promise<string | null> => {
        try {
            const imageItem = await web.lists.getByTitle('Reciept').items.getById(parseInt(imageId)).get();
            return imageItem.ServerRelativeUrl || null;
        } catch (error: any) {
            console.log("Error getting image URL:", error);
            return null;
        }
    };

    // Store image reference in Reciept list (optional metadata)
    const storeImageReference = async (serverRelativeUrl: string, expenseId: string): Promise<string | null> => {
        try {
            const imageItem = await web.lists.getByTitle('Reciept').items.add({
                Title: `Expense_${expenseId}_${Date.now()}`,
                ServerRelativeUrl: serverRelativeUrl,
                ExpenseId: expenseId
            });
            return imageItem.data.Id.toString();
        } catch (error: any) {
            console.log("Error storing image reference (this is optional):", error);
            // Don't throw error, just return null as this is optional metadata
            return null;
        }
    };

    // Update Expense Data
    const updateExpense = async(item: any): Promise<any> => {
        try {
            let imageUrl = item.billUrl;
            let formattedImageData: any = null;

            // If a new file is uploaded, handle it
            if (item.file && item.file instanceof File) {
                try {
                    // Upload new image
                    const serverRelativeUrl = await uploadImageToLibrary(item.file);
                    // Store reference in Reciept list (optional)
                    await storeImageReference(serverRelativeUrl, item.Id);
                    imageUrl = serverRelativeUrl;
                    // Format for Hyperlink and Picture column
                    formattedImageData = formatImageForHyperlinkPicture(serverRelativeUrl, item.description);
                } catch (uploadError) {
                    console.log("Error uploading new image:", uploadError);
                }
            } else if (imageUrl) {
                // If there's an existing image URL, format it
                formattedImageData = formatImageForHyperlinkPicture(imageUrl, item.description);
            }

            const updateData: any = {
                Title: item.description || "New Expense",
                Description: item.description,
                Category: item.category,
                Amount: Number(item.amount),
                Date: new Date(item.date).toISOString(),
                Comments: item.comments
            };

            // Only add Reciept field if we have image data
            if (formattedImageData) {
                updateData.Reciept = formattedImageData;
            }

            const updatedRes = await web.lists.getByTitle('TsharperExpenses')
              .items.getById(item.Id)
              .update(updateData);
            await fetchExpenses();

            setExpenseData(prev => 
              prev.map(e => e.Id === item.Id ? { ...e, ...updatedRes.data } : e)
            );

            console.log("Expense updated successfully", updatedRes.data);
        } catch (error: any) {
            console.log("update expenses error :: ", error);
        }
    };



    const fetchExpenses = async () => {
        try {
            const res = await web.lists.getByTitle('TsharperExpenses').items.get();
            
            // Map expenses and parse the Hyperlink and Picture format
            const expensesWithImages = res.map((expense: any) => {
                const imageUrl = parseImageFromHyperlinkPicture(expense.Reciept);
                return {
                    ...expense,
                    billUrl: imageUrl
                };
            });
            
            setExpenseData(expensesWithImages);
        } catch (err: any) {
            console.log("fetch expenses error :: ", err)
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // Add Expense Data
    const addExpense = async (item: any): Promise<void> => {
        try {
            let imageUrl = item.billUrl;
            let formattedImageData: any = null;

            // If a file is uploaded, handle it
            if (item.file && item.file instanceof File) {
                try {
                    // Upload image to picture library
                    const serverRelativeUrl = await uploadImageToLibrary(item.file);
                    imageUrl = serverRelativeUrl;
                    // Format for Hyperlink and Picture column
                    formattedImageData = formatImageForHyperlinkPicture(serverRelativeUrl, item.description);
                } catch (uploadError) {
                    console.log("Error uploading image:", uploadError);
                }
            } else if (imageUrl) {
                // If there's an existing image URL, format it
                formattedImageData = formatImageForHyperlinkPicture(imageUrl, item.description);
            }

            const expenseData: any = {
                Title: item.description,  
                Description: item.description,
                Category: item.category,
                Amount: Number(item.amount),               
                Date: item.date,    
                Comments: item.comments
            };

            // Only add Reciept field if we have image data
            if (formattedImageData) {
                expenseData.Reciept = formattedImageData;
            }

            const res = await web.lists.getByTitle("TsharperExpenses").items.add(expenseData);

            // Store image reference in Reciept list (optional metadata)
            if (imageUrl) {
                try {
                    await storeImageReference(imageUrl, res.data.Id);
                } catch (updateError) {
                    console.log("Error storing image reference (optional):", updateError);
                }
            }

            setExpenseData((prev) => [...prev, { ...res.data, billUrl: imageUrl }]);
            console.log("Expense added successfully", res.data);
        } catch (err: any) {
            console.log("add expenses error :: ", err);
        }
    };

        

    // Delete Expenses Data
    const deleteExpense = async(item: any): Promise<any> => {
        try {
            const deleteRes = await web.lists.getByTitle("TsharperExpenses").items.getById(item.Id).delete();
            setExpenseData(prev => prev.filter(e => e.Id !== item.Id))
            console.log("deleted item :: ", deleteRes)
        } catch (error: any) {
            console.log("delete expenses :: ", error)
        }
    }

    return {
        expenseData, 
        addExpense, 
        updateExpense, 
        deleteExpense,
        uploadImageToLibrary,
        getImageUrl,
        storeImageReference,
        formatImageForHyperlinkPicture,
        parseImageFromHyperlinkPicture
    };
}