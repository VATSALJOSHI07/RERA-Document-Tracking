    // server.js
    const express = require('express');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const jwt = require('jsonwebtoken');
    require('dotenv').config();
    const path = require('path');
    const PDFDocument = require('pdfkit');

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Middleware

    // Define allowedOrigins for CORS
    const allowedOrigins = [
    'https://vatsaljoshi07.github.io',
    'https://rera-document-tracking.onrender.com',
    undefined // allow Postman, curl, etc.
    ];

    app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        } else {
        callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
    }));

    
    app.use(express.json());

    // MongoDB Connection
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/developer_management', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

    // Schemas
    const userSchema = new mongoose.Schema({
        userId: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true }
    });
    const User = mongoose.model('User', userSchema);

    // JWT Secret
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

    // Auth Middleware
    function authMiddleware(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.user = payload;
            next();
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }


    // Register Endpoint
    app.post('/api/register', async (req, res) => {
        const { userId, password } = req.body;
        if (!userId || !password) return res.status(400).json({ error: 'User ID and password required' });
        const existing = await User.findOne({ userId });
        if (existing) return res.status(400).json({ error: 'User ID already exists' });
        // Store password as plain text
        const user = new User({ userId, passwordHash: password });
        await user.save();
        res.json({ message: 'User registered successfully' });
    });

    // Login Endpoint
    app.post('/api/login', async (req, res) => {
        const { userId, password } = req.body;
        const user = await User.findOne({ userId });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        // Compare plain text password
        const valid = user.passwordHash === password;
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ userId: user.userId, _id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    });

    const clientSchema = new mongoose.Schema({
        type: {
            type: String,
            required: true,
            enum: ['Developer', 'Agent', 'Litigation']
        },
        name: {
            type: String,
            required: true
        },
        promoterName: String,
        location: String,
        plotNo: String,
        plotArea: String,
        totalUnits: Number,
        bookedUnits: Number,
        workStatus: {
            type: String,
            enum: ['Not Started', 'In Progress', 'Completed'],
            required: false
        },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // owner
        reraNumber: String,
        certificateDate: Date,
        mobile: {
            type: String,
            required: true
        },
        officeNumber: String,
        email: String,
        caName: String,
        engineerName: String,
        architectName: String,
        reference: String,
        completionDate: Date,
        dateCreated: {
            type: Date,
            default: Date.now
        }
    });

    const documentSchema = new mongoose.Schema({
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // owner
        documents: {
            type: Map,
            of: String, // 'received' or 'not-received'
            default: {}
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    });

    const paymentSchema = new mongoose.Schema({
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // owner
        amount: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        dueDate: Date,
        paidAmount: {
            type: Number,
            default: 0
        },
        transactions: [{
            amount: Number,
            date: Date,
            notes: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        dateCreated: {
            type: Date,
            default: Date.now
        }
    });

    // Models
    const Client = mongoose.model('Client', clientSchema);
    const Document = mongoose.model('Document', documentSchema);
    const Payment = mongoose.model('Payment', paymentSchema);

    // Task model
    const taskSchema = new mongoose.Schema({
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: String,
        service: String,
        allocatedMembers: String,
        assignedMembers: String,
        priority: String,
        dueDate: String,
        team: String,
        clientSource: String,
        status: String,
        governmentFees: String,
        sroFees: String,
        billAmount: String,
        gst: String,
        branch: String,
        remark: String,
        note: String,
        description: String,
        dateCreated: { type: Date, default: Date.now }
    });
    const Task = mongoose.model('Task', taskSchema);

    // Default documents list
    const defaultDocuments = [
        'PAN Card of the Firm/Company',
        'Udyam Aadhar / Gumasta',
        'KYC of Partners',
        'KYC of Authorized Signatory',
        'Board Resolution',
        'Commencement Certificate',
        'Approved Plan Layout',
        'RERA Carpet Area Statement',
        'Sale Deed',
        'Power of Attorney',
        'Mortgage Deed',
        'Tally Data',
        'Form 3 – CA Certificate',
        'Bifurcation of Units',
        'Bank Account Details',
        'Title Report',
        'Form 1 – Architect Certificate',
        'Letterhead',
        'Partnership Deed',
        'GST Certificate',
        'Land Ownership Documents',
        'Agreement for Sale and Deviation Reports',
        'Allotment Letter and Deviation Reports',
        'Project Name',
        'Completion Date',
        'Architect Details',
        'RCC Consultant Details',
        'CA Details',
        'Contact Person Details for MahaRERA Profile',
        'Loan and Litigation Information',
        'Phase-wise Project Details',
        'Google Map Location of the Project',
        'Address Proof of the Organization',
        'NOC if Address Proof is not in the firm\'s name',
        'CC Verification Email Screenshot',
        'Amenities Details',
        'SRO Membership Certificate'
    ];

    // Routes

    // Client Routes
    app.get('/api/clients', authMiddleware, async (req, res) => {
        try {
            const clients = await Client.find({ userId: req.user._id }).select('-password');
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/clients', authMiddleware, async (req, res) => {
        try {
            const clientData = req.body;
            clientData.userId = req.user._id;
            
            const client = new Client(clientData);
            await client.save();
            
            // Create default documents for the client
            const documentMap = new Map();
            defaultDocuments.forEach(doc => {
                documentMap.set(doc, 'not-received');
            });
            
            const clientDocuments = new Document({
                clientId: client._id,
                userId: req.user._id,
                documents: documentMap
            });
            await clientDocuments.save();
            
            const clientResponse = client.toObject();
            res.status(201).json(clientResponse);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.get('/api/clients/:id', authMiddleware, async (req, res) => {
        try {
            const client = await Client.findById(req.params.id).select('-password');
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
            res.json(client);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/clients/:id', authMiddleware, async (req, res) => {
        try {
            const updateData = req.body;
            // Prevent duplicate client name/location for the same user
            const duplicate = await Client.findOne({
                _id: { $ne: req.params.id },
                userId: req.user._id,
                name: updateData.name,
                location: updateData.location
            });
            if (duplicate) {
                return res.status(400).json({ error: 'A client with this name and location already exists.' });
            }
            const client = await Client.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            ).select('-password');
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
            res.json(client);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
        try {
            const client = await Client.findByIdAndDelete(req.params.id);
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }
            // Delete related documents, payments, and tasks
            await Document.deleteMany({ clientId: req.params.id });
            await Payment.deleteMany({ clientId: req.params.id });
            await Task.deleteMany({ clientId: req.params.id });
            res.json({ message: 'Client deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Document Routes
    app.get('/api/documents/:clientId', authMiddleware, async (req, res) => {
        try {
            const documents = await Document.findOne({ clientId: req.params.clientId });
            if (!documents) {
                return res.status(404).json({ error: 'Documents not found' });
            }
            res.json(documents);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/documents/:clientId', authMiddleware, async (req, res) => {
        try {
            const { documentName, status } = req.body;
            
            const documents = await Document.findOne({ clientId: req.params.clientId });
            if (!documents) {
                return res.status(404).json({ error: 'Documents not found' });
            }
            
            documents.documents.set(documentName, status);
            documents.lastUpdated = new Date();
            await documents.save();
            
            res.json(documents);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/documents/:clientId/add', authMiddleware, async (req, res) => {
        try {
            const { documentName } = req.body;
            
            const documents = await Document.findOne({ clientId: req.params.clientId });
            if (!documents) {
                return res.status(404).json({ error: 'Documents not found' });
            }
            
            if (documents.documents.has(documentName)) {
                return res.status(400).json({ error: 'Document already exists' });
            }
            
            documents.documents.set(documentName, 'not-received');
            documents.lastUpdated = new Date();
            await documents.save();
            
            res.json(documents);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Payment Routes
    app.get('/api/payments/:clientId', authMiddleware, async (req, res) => {
        try {
            const payments = await Payment.find({ clientId: req.params.clientId });
            res.json(payments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/payments', authMiddleware, async (req, res) => {
        try {
            const paymentData = req.body;
            if (!paymentData.clientId) {
                return res.status(400).json({ error: 'clientId is required' });
            }
            paymentData.userId = req.user._id; // Ensure userId is set from the logged-in user
            const payment = new Payment(paymentData);
            await payment.save();
            res.json(payment);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/payments/:id/record', authMiddleware, async (req, res) => {
        try {
            const { amount, date, notes } = req.body;
            
            const payment = await Payment.findById(req.params.id);
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            
            const remainingAmount = payment.amount - payment.paidAmount;
            if (amount > remainingAmount) {
                return res.status(400).json({ error: 'Amount exceeds remaining balance' });
            }
            
            payment.transactions.push({
                amount,
                date,
                notes,
                timestamp: new Date()
            });
            
            payment.paidAmount += amount;
            await payment.save();
            
            res.json(payment);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    app.delete('/api/payments/:id', authMiddleware, async (req, res) => {
        try {
            const payment = await Payment.findById(req.params.id);
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }
            // Only allow delete if fully received
            if ((payment.paidAmount || 0) < payment.amount) {
                return res.status(400).json({ error: 'Cannot delete payment unless it is fully received.' });
            }
            await Payment.findByIdAndDelete(req.params.id);
            res.json({ message: 'Payment deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Add this route to return all payments for the current user
    app.get('/api/payments', authMiddleware, async (req, res) => {
        try {
            const payments = await Payment.find({ userId: req.user._id });
            res.json(payments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Task Routes
    app.post('/api/tasks', authMiddleware, async (req, res) => {
        try {
            const taskData = req.body;
            // Ensure clientId is present and valid
            if (!taskData.clientId) {
                return res.status(400).json({ error: 'clientId is required' });
            }
            // Set userId from the logged-in user
            taskData.userId = req.user._id;
            const task = new Task(taskData);
            await task.save();
            res.json(task);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app.get('/api/tasks/:clientId', authMiddleware, async (req, res) => {
        try {
            const tasks = await Task.find({ clientId: req.params.clientId });
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Add this endpoint to allow deleting a task by its ID
    app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
        try {
            const task = await Task.findByIdAndDelete(req.params.id);
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json({ message: 'Task deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Add this endpoint to allow updating a task by its ID
    app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
        try {
            const updateData = req.body;
            const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }
            res.json(task);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Search Routes
    app.get('/api/search/clients', authMiddleware, async (req, res) => {
        try {
            const { q } = req.query;
            const clients = await Client.find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { promoterName: { $regex: q, $options: 'i' } },
                    { location: { $regex: q, $options: 'i' } }
                ]
            }).select('-password');
            res.json(clients);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Add this route after your other API routes:
    app.get('/api/user', authMiddleware, async (req, res) => {
        // You may want to return more user info if you store it
        res.json({ userId: req.user.userId, _id: req.user._id });
    });

    // Endpoint to export pending documents for all clients in PDF format
    app.get('/api/export/pending-documents', authMiddleware, async (req, res) => {
        try {
            const clients = await Client.find({ userId: req.user._id });
            const clientIds = clients.map(c => c._id);
            const documentsList = await Document.find({ clientId: { $in: clientIds } });

            // Prepare PDF
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="pending_documents.pdf"');
            doc.pipe(res);
            doc.fontSize(18).text('Pending Documents', { align: 'center' });
            doc.moveDown();
            for (const client of clients) {
                const docEntry = documentsList.find(d => d.clientId.toString() === client._id.toString());
                if (docEntry && docEntry.documents) {
                    const pendingDocs = Array.from(docEntry.documents.entries()).filter(([_, status]) => status === 'not-received');
                    if (pendingDocs.length > 0) {
                        doc.fontSize(14).text(client.name, { underline: true });
                        pendingDocs.forEach(([docName]) => {
                            doc.fontSize(12).text(docName, { indent: 20 });
                        });
                        doc.moveDown();
                    }
                }
            }
            doc.end();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    // Endpoint to export pending documents for a single client in PDF format
    app.get('/api/export/pending-documents/:clientId', authMiddleware, async (req, res) => {
        try {
            const client = await Client.findOne({ _id: req.params.clientId, userId: req.user._id });
            if (!client) return res.status(404).json({ error: 'Client not found' });
            const docEntry = await Document.findOne({ clientId: client._id });
            if (!docEntry) return res.status(404).json({ error: 'Documents not found' });
            const pendingDocs = Array.from(docEntry.documents.entries()).filter(([_, status]) => status === 'not-received');
            // Prepare PDF
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="pending_documents_${client.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
            doc.pipe(res);
            doc.fontSize(18).text(`Pending Documents for ${client.name}`, { align: 'center' });
            doc.moveDown();
            if (pendingDocs.length === 0) {
                doc.fontSize(12).text('No pending documents.');
            } else {
                pendingDocs.forEach(([docName]) => {
                    doc.fontSize(12).text(docName);
                });
            }
            doc.end();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Health check route
    app.get('/api/health', (req, res) => {
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Something went wrong!' });
    });

    // Serve static files from the 'public' directory
    app.use(express.static(path.join(__dirname, 'public')));

    // Fallback: serve index.html for any unknown routes (for SPAs)
    app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'documents.html'));
    });

    // Start server
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    module.exports = app;
